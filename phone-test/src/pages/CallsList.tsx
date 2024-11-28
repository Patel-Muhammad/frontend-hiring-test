import React from 'react';
import { useQuery } from '@apollo/client';
import styled from 'styled-components';
import { PAGINATED_CALLS } from '../gql/queries';
import {
  Grid,
  Icon,
  Typography,
  Spacer,
  Box,
  DiagonalDownOutlined,
  DiagonalUpOutlined,
  Pagination,
  Dropdown,
  Menu,
  Button,
  MenuItem,
} from '@aircall/tractor';
import { formatDate, formatDuration } from '../helpers/dates';
import { useNavigate, useSearchParams } from 'react-router-dom';

export const PaginationWrapper = styled.div`
  > div {
    width: inherit;
    margin-top: 20px;
    display: flex;
    justify-content: center;
  }
`;

const INITIAL_PAGE_SIZE = 5;

export const CallsListPage = () => {
  const [search, setSearch] = useSearchParams();
  const navigate = useNavigate();

  const pageQueryParams = search.get('page');
  const pageSizeQueryParams = search.get('pageSize');

  const activePage = pageQueryParams ? parseInt(pageQueryParams) : 1;
  const activePageSize = pageSizeQueryParams ? parseInt(pageSizeQueryParams) : INITIAL_PAGE_SIZE;

  const [callTypeFilter, setCallTypeFilter] = React.useState<string>('all');
  const [directionFilter, setDirectionFilter] = React.useState<string>('all');

  const { loading, error, data } = useQuery(PAGINATED_CALLS, {
    variables: {
      offset: 0,
      limit: 100,
    },
  });

  if (loading) return <p>Loading calls...</p>;
  if (error) return <p>ERROR</p>;
  if (!data) return <p>Not found</p>;

  const { nodes: allCalls } = data.paginatedCalls;

  // Apply filtering by call type
  let filteredCalls = callTypeFilter === 'all'
    ? allCalls
    : allCalls.filter((call: Call) => call.call_type === callTypeFilter);

  // Apply additional filtering by direction
  filteredCalls = directionFilter === 'all'
    ? filteredCalls
    : filteredCalls.filter((call: Call) => call.direction === directionFilter);

  // Flatten grouped calls into a single array and include dateKey
  const flattenedCalls = Object.keys(
    filteredCalls.reduce((acc: Record<string, Call[]>, call: Call) => {
      const dateKey = new Date(call.created_at).toDateString();
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(call);
      return acc;
    }, {})
  ).flatMap((dateKey) =>
    filteredCalls
      .filter((call: Call) => new Date(call.created_at).toDateString() === dateKey)
      .map((call: Call) => ({ ...call, dateKey })) // Add type annotation here
  );

  const paginatedCalls = flattenedCalls.slice(
    (activePage - 1) * activePageSize,
    activePage * activePageSize
  );

  const handleCallOnClick = (callId: string) => {
    navigate(`/calls/${callId}`);
  };

  const handlePageChange = (page: number) => {
    setSearch({ page: page.toString(), pageSize: activePageSize.toString() });
  };

  const handlePageSizeChange = (pageSize: number) => {
    setSearch({ page: '1', pageSize: pageSize.toString() });
  };

  const handleFilterChange = (filter: string) => {
    setCallTypeFilter(filter);
  };

  const handleDirectionChange = (direction: string) => {
    setDirectionFilter(direction);
  };

  const displayedDates = new Set<string>();

  return (
    <>
      <Typography variant="displayM" textAlign="center" py={3}>
        Calls History
      </Typography>

      <Spacer py={2} justifyContent={'space-between'}>
        <Dropdown
          align="start"
          side="bottom"
          takeViewportHeight
          trigger={<Button size="xSmall" mode="outline">Call Type: {callTypeFilter}</Button>}
        >
          <Menu>
            <MenuItem.Root itemKey="all" onClick={() => handleFilterChange('all')}>
              All Calls
            </MenuItem.Root>
            <MenuItem.Root itemKey="missed" onClick={() => handleFilterChange('missed')}>
              Missed Calls
            </MenuItem.Root>
            <MenuItem.Root itemKey="answered" onClick={() => handleFilterChange('answered')}>
              Answered Calls
            </MenuItem.Root>
            <MenuItem.Root itemKey="voicemail" onClick={() => handleFilterChange('voicemail')}>
              Voicemails
            </MenuItem.Root>
          </Menu>
        </Dropdown>

        <Dropdown
          align="start"
          side="bottom"
          takeViewportHeight
          trigger={<Button size="xSmall" mode="outline">Direction: {directionFilter}</Button>}
        >
          <Menu>
            <MenuItem.Root itemKey="all" onClick={() => handleDirectionChange('all')}>
              All Directions
            </MenuItem.Root>
            <MenuItem.Root itemKey="inbound" onClick={() => handleDirectionChange('inbound')}>
              Incoming
            </MenuItem.Root>
            <MenuItem.Root itemKey="outbound" onClick={() => handleDirectionChange('outbound')}>
              Outgoing
            </MenuItem.Root>
          </Menu>
        </Dropdown>
      </Spacer>

      <div style={{ height: '65vh', overflow: 'scroll' }}>
        {paginatedCalls.map((call) => {
          const icon = call.direction === 'inbound' ? DiagonalDownOutlined : DiagonalUpOutlined;
          const title =
            call.call_type === 'missed'
              ? 'Missed call'
              : call.call_type === 'answered'
              ? 'Call answered'
              : 'Voicemail';
          const subtitle =
            call.direction === 'inbound' ? `from ${call.from}` : `to ${call.to}`;
          const duration = formatDuration(call.duration / 1000);
          const date = formatDate(call.created_at);
          const notes = call.notes ? `Call has ${call.notes.length} notes` : <></>;

          const isNewDate = !displayedDates.has(call.dateKey);
          if (isNewDate) {
            displayedDates.add(call.dateKey);
          }

          return (
            <Box key={call.id} py={2}>
              {isNewDate && (
                <Typography mb={2} color="#00B388" fontSize="large">
                  {call.dateKey}
                </Typography>
              )}
              <Box
                bg="black-a30"
                borderRadius={16}
                cursor="pointer"
                onClick={() => handleCallOnClick(call.id)}
              >
                <Grid
                  gridTemplateColumns="60px 1fr max-content"
                  columnGap={2}
                  alignItems="center"
                  px={4}
                  py={2}
                >
                  <Box>
                    <Icon component={icon} size={42} />
                  </Box>
                  <Box>
                    <Typography variant="body">{title}</Typography>
                    <Typography variant="body2">{subtitle}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" textAlign="right">
                      {duration}
                    </Typography>
                    <Typography variant="caption">{date}</Typography>
                  </Box>
                </Grid>
                <Box px={4} py={2}>
                  <Typography variant="caption">{notes}</Typography>
                </Box>
              </Box>
            </Box>
          );
        })}
      </div>

      {flattenedCalls.length > 0 && (
        <PaginationWrapper>
          <Pagination
            activePage={activePage}
            pageSize={activePageSize}
            onPageChange={handlePageChange}
            recordsTotalCount={flattenedCalls.length}
            onPageSizeChange={handlePageSizeChange}
            pageSizeOptions={[
              { value: 5, label: '5' },
              { value: 10, label: '10' },
              { value: 25, label: '25' },
              { value: 50, label: '50' },
            ]}
          />
        </PaginationWrapper>
      )}
    </>
  );
};
